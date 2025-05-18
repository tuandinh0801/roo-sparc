import { Command } from 'commander';
import { AbstractListDefinitionsCommand, DefinitionItem } from '../base/AbstractListDefinitionsCommand.js';
import { ModeDefinitionWithSource } from '../../types/domain.js';
import { CommandOptions } from '../base/BaseCommand.js'; // Import CommandOptions

/**
 * @class ListModesCommand
 * @description Command to list available modes (system, custom, or all).
 */
export class ListModesCommand extends AbstractListDefinitionsCommand<ModeDefinitionWithSource> {
  static description = 'List available modes (system, custom, or all).';

  protected commandName = 'modes'; // Corrected: Direct assignment
  protected commandDescription = ListModesCommand.description;
  protected entityName = 'mode';
  protected entityNamePlural = 'modes';

  constructor(options: CommandOptions) {
    super(options);
  }

  // setupCommand is inherited and should work as is if commandName and commandDescription are set

  protected async getCustomDefinitions(): Promise<ModeDefinitionWithSource[]> {
    return this.definitionLoader.getCustomModes();
  }

  protected async getSystemDefinitions(): Promise<ModeDefinitionWithSource[]> {
    return this.definitionLoader.getSystemModes();
  }

  protected async getMergedDefinitions(): Promise<ModeDefinitionWithSource[]> {
    return this.definitionLoader.getMergedModes();
  }

  // The execute method is now handled by the abstract class
}
