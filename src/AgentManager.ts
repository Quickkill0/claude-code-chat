import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'js-yaml';

interface AgentMetadata {
    name: string;
    description: string;
    model?: 'opus' | 'sonnet' | 'haiku';
    color?: 'green' | 'blue' | 'red' | 'cyan' | 'yellow' | 'purple' | 'orange' | 'pink';
    tools?: string[];
}

interface Agent {
    metadata: AgentMetadata;
    systemPrompt: string;
    scope: 'local' | 'user';
    filePath: string;
}

export class AgentManager {
    private localAgentsPath: string;
    private userAgentsPath: string;
    private workspaceRoot: string | undefined;

    constructor(context: vscode.ExtensionContext) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        this.workspaceRoot = workspaceFolders?.[0]?.uri.fsPath;

        this.localAgentsPath = this.workspaceRoot
            ? path.join(this.workspaceRoot, '.claude', 'agents')
            : '';

        this.userAgentsPath = path.join(os.homedir(), '.claude', 'agents');
    }

    private async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    private parseAgentFile(content: string): { metadata: AgentMetadata; systemPrompt: string } {
        // Handle different frontmatter formats
        const trimmedContent = content.trim();

        // Check for YAML frontmatter (---\n...\n---)
        if (trimmedContent.startsWith('---')) {
            const endOfFrontmatter = trimmedContent.indexOf('\n---', 4);

            if (endOfFrontmatter === -1) {
                // No closing frontmatter, treat entire content as system prompt
                return {
                    metadata: {
                        name: 'unnamed-agent',
                        description: 'No description provided'
                    },
                    systemPrompt: trimmedContent
                };
            }

            const yamlContent = trimmedContent.substring(4, endOfFrontmatter).trim();
            const systemPrompt = trimmedContent.substring(endOfFrontmatter + 4).trim();

            // First, try to extract metadata using simple regex (most reliable)
            const nameMatch = yamlContent.match(/^name:\s*(.+)$/m);
            const modelMatch = yamlContent.match(/^model:\s*(.+)$/m);
            const colorMatch = yamlContent.match(/^color:\s*(.+)$/m);

            // Extract description - handle multiline case
            let description = 'No description provided';
            const descMatch = yamlContent.match(/^description:\s*(.+?)(?=\n[a-zA-Z]+:|$)/ms);
            if (descMatch) {
                description = descMatch[1]
                    .replace(/^\|[-+]?\s*/m, '') // Remove YAML literal block indicators
                    .replace(/^>\s*/m, '') // Remove YAML folded block indicators
                    .trim();
            }

            // Try to parse with YAML if possible for completeness
            try {
                const metadata = yaml.load(yamlContent, {
                    schema: yaml.JSON_SCHEMA,
                    json: true
                }) as any;

                if (metadata && typeof metadata === 'object') {
                    // Use YAML-parsed values if available, fallback to regex
                    return {
                        metadata: {
                            name: metadata.name || (nameMatch ? nameMatch[1].trim() : 'unnamed-agent'),
                            description: this.cleanDescription(metadata.description || description),
                            model: metadata.model || (modelMatch ? modelMatch[1].trim() as any : undefined),
                            color: metadata.color || (colorMatch ? colorMatch[1].trim() as any : undefined),
                            tools: metadata.tools
                        },
                        systemPrompt: systemPrompt || ''
                    };
                }
            } catch (yamlError) {
                // YAML parsing failed, use regex results
                console.log('YAML parsing failed, using regex fallback');
            }

            // Return regex-extracted metadata
            return {
                metadata: {
                    name: nameMatch ? nameMatch[1].trim() : 'unnamed-agent',
                    description: this.cleanDescription(description),
                    model: modelMatch ? modelMatch[1].trim() as any : undefined,
                    color: colorMatch ? colorMatch[1].trim() as any : undefined
                },
                systemPrompt: systemPrompt || ''
            };
        } else {
            // No frontmatter at all, treat entire content as system prompt
            return {
                metadata: {
                    name: 'unnamed-agent',
                    description: 'No frontmatter found'
                },
                systemPrompt: trimmedContent
            };
        }
    }

    private cleanDescription(description: string): string {
        if (!description || typeof description !== 'string') {
            return 'No description provided';
        }

        // Clean up description
        let cleaned = description
            .replace(/<example>[\s\S]*?<\/example>/g, '') // Remove example blocks
            .replace(/<commentary>[\s\S]*?<\/commentary>/g, '') // Remove commentary blocks
            .replace(/Examples?:[\s\S]*?(?=\n[A-Za-z]|\n$|$)/g, '') // Remove Examples sections
            .replace(/\n\s*\n/g, ' ') // Replace multiple newlines with space
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        // Truncate if too long
        if (cleaned.length > 200) {
            cleaned = cleaned.substring(0, 197) + '...';
        }

        return cleaned || 'No description provided';
    }

    private formatAgentFile(agent: Partial<Agent>): string {
        if (!agent.metadata || !agent.systemPrompt) {
            throw new Error('Agent must have metadata and system prompt');
        }
        
        const yamlContent = yaml.dump(agent.metadata, {
            indent: 2,
            lineWidth: -1
        });
        
        return `---\n${yamlContent}---\n\n${agent.systemPrompt}`;
    }

    async listAgents(scope: 'local' | 'user' | 'both' = 'both'): Promise<Agent[]> {
        const agents: Agent[] = [];

        if ((scope === 'local' || scope === 'both') && this.workspaceRoot) {
            try {
                await this.ensureDirectoryExists(this.localAgentsPath);
                const files = await fs.readdir(this.localAgentsPath);
                
                for (const file of files) {
                    if (file.endsWith('.md')) {
                        try {
                            const filePath = path.join(this.localAgentsPath, file);
                            const content = await fs.readFile(filePath, 'utf-8');
                            const { metadata, systemPrompt } = this.parseAgentFile(content);

                            // Use filename as fallback for agent name
                            if (metadata.name === 'unnamed-agent') {
                                metadata.name = file.replace('.md', '');
                            }

                            agents.push({
                                metadata,
                                systemPrompt,
                                scope: 'local',
                                filePath
                            });
                        } catch (error) {
                            console.error(`Error parsing agent file ${file}:`, error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error listing local agents:', error);
            }
        }
        
        if (scope === 'user' || scope === 'both') {
            try {
                await this.ensureDirectoryExists(this.userAgentsPath);
                const files = await fs.readdir(this.userAgentsPath);
                
                for (const file of files) {
                    if (file.endsWith('.md')) {
                        try {
                            const filePath = path.join(this.userAgentsPath, file);
                            const content = await fs.readFile(filePath, 'utf-8');
                            const { metadata, systemPrompt } = this.parseAgentFile(content);

                            // Use filename as fallback for agent name
                            if (metadata.name === 'unnamed-agent') {
                                metadata.name = file.replace('.md', '');
                            }

                            agents.push({
                                metadata,
                                systemPrompt,
                                scope: 'user',
                                filePath
                            });
                        } catch (error) {
                            console.error(`Error parsing agent file ${file}:`, error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error listing user agents:', error);
            }
        }
        
        return agents;
    }

    async getAgent(name: string, scope: 'local' | 'user'): Promise<Agent | null> {
        const basePath = scope === 'local' ? this.localAgentsPath : this.userAgentsPath;
        
        if (scope === 'local' && !this.workspaceRoot) {
            throw new Error('No workspace open for local agents');
        }
        
        const filePath = path.join(basePath, `${name}.md`);
        
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const { metadata, systemPrompt } = this.parseAgentFile(content);
            
            return {
                metadata,
                systemPrompt,
                scope,
                filePath
            };
        } catch (error) {
            if ((error as any).code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    async createAgent(agent: Omit<Agent, 'filePath'>, overwrite: boolean = false): Promise<Agent> {
        const basePath = agent.scope === 'local' ? this.localAgentsPath : this.userAgentsPath;
        
        if (agent.scope === 'local' && !this.workspaceRoot) {
            throw new Error('No workspace open for local agents');
        }
        
        await this.ensureDirectoryExists(basePath);
        
        const fileName = `${agent.metadata.name}.md`;
        const filePath = path.join(basePath, fileName);
        
        if (!overwrite) {
            try {
                await fs.access(filePath);
                throw new Error(`Agent ${agent.metadata.name} already exists in ${agent.scope} scope`);
            } catch (error) {
                if ((error as any).code !== 'ENOENT') {
                    throw error;
                }
            }
        }
        
        const content = this.formatAgentFile(agent);
        await fs.writeFile(filePath, content, 'utf-8');
        
        return {
            ...agent,
            filePath
        };
    }

    async updateAgent(name: string, scope: 'local' | 'user', updates: Partial<Agent>): Promise<Agent> {
        const existingAgent = await this.getAgent(name, scope);
        
        if (!existingAgent) {
            throw new Error(`Agent ${name} not found in ${scope} scope`);
        }
        
        const updatedAgent: Agent = {
            ...existingAgent,
            metadata: {
                ...existingAgent.metadata,
                ...(updates.metadata || {})
            },
            systemPrompt: updates.systemPrompt || existingAgent.systemPrompt
        };
        
        const oldFilePath = existingAgent.filePath;
        const newFileName = `${updatedAgent.metadata.name}.md`;
        const basePath = scope === 'local' ? this.localAgentsPath : this.userAgentsPath;
        const newFilePath = path.join(basePath, newFileName);
        
        const content = this.formatAgentFile(updatedAgent);
        await fs.writeFile(newFilePath, content, 'utf-8');
        
        if (oldFilePath !== newFilePath) {
            await fs.unlink(oldFilePath);
        }
        
        return {
            ...updatedAgent,
            filePath: newFilePath
        };
    }

    async deleteAgent(name: string, scope: 'local' | 'user'): Promise<boolean> {
        const basePath = scope === 'local' ? this.localAgentsPath : this.userAgentsPath;
        
        if (scope === 'local' && !this.workspaceRoot) {
            throw new Error('No workspace open for local agents');
        }
        
        const filePath = path.join(basePath, `${name}.md`);
        
        try {
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            if ((error as any).code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    }

    async cloneAgent(name: string, fromScope: 'local' | 'user', toScope: 'local' | 'user', newName?: string): Promise<Agent> {
        const sourceAgent = await this.getAgent(name, fromScope);
        
        if (!sourceAgent) {
            throw new Error(`Agent ${name} not found in ${fromScope} scope`);
        }
        
        const clonedAgent: Omit<Agent, 'filePath'> = {
            metadata: {
                ...sourceAgent.metadata,
                name: newName || `${sourceAgent.metadata.name}-copy`
            },
            systemPrompt: sourceAgent.systemPrompt,
            scope: toScope
        };
        
        return await this.createAgent(clonedAgent);
    }

    async validateAgentFormat(content: string): Promise<{ valid: boolean; error?: string }> {
        try {
            this.parseAgentFile(content);
            return { valid: true };
        } catch (error) {
            return { 
                valid: false, 
                error: error instanceof Error ? error.message : 'Unknown validation error'
            };
        }
    }

    async searchAgents(query: string, scope: 'local' | 'user' | 'both' = 'both'): Promise<Agent[]> {
        const allAgents = await this.listAgents(scope);
        const lowerQuery = query.toLowerCase();
        
        return allAgents.filter(agent => 
            agent.metadata.name.toLowerCase().includes(lowerQuery) ||
            agent.metadata.description.toLowerCase().includes(lowerQuery) ||
            agent.systemPrompt.toLowerCase().includes(lowerQuery)
        );
    }
}