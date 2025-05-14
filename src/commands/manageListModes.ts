import { Command } from 'commander';
import { definitionLoader, ModeDefinitionDisplay } from '../core/DefinitionLoader.js'; // Import instance
import { displayTable, showMessage } from '../utils/uiManager.js';
import { ModeDefinition, SourceType } from '../types/domain.js';

interface ListModesOptions {
  source?: SourceType;
}

/**
 * Handles the 'manage list modes' command.
 * @param options - Command options.
 * @param command - Commander command object.
 */
export async function manageListModes(options: ListModesOptions, command: Command): Promise<void> {
  const sourceToLoad = options.source || 'custom';

  try {
    // Use the getModeDefinitions method from the definitionLoader instance
    const modes = await definitionLoader.getModeDefinitions(sourceToLoad as SourceType);


    if (!modes || modes.length === 0) {
      let message = 'No modes found.';
      if (sourceToLoad === 'custom') {
        message = 'No custom modes found.';
      } else if (sourceToLoad === 'system') {
        message = 'No system modes found.';
      }
      showMessage('info', message);
      return;
    }

    const tableData = modes.map((mode: ModeDefinition | ModeDefinitionDisplay) => {
      let displaySource: string;

      if (sourceToLoad === 'all') {
        // When source is 'all', modes are ModeDefinitionDisplay
        const displayMode = mode as ModeDefinitionDisplay;
        switch (displayMode.sourceType) {
          case 'system':
            displaySource = 'system';
            break;
          case 'custom':
            displaySource = 'custom';
            break;
          case 'custom-override':
            displaySource = 'custom (overrides system)';
            break;
          default:
            displaySource = 'unknown';
            break;
        }
      } else {
        // For 'custom' or 'system', modes are ModeDefinition
        if (mode.source === 'user') {
          displaySource = 'custom';
        } else if (mode.source === 'system') {
          displaySource = 'system';
        } else {
          displaySource = 'unknown';
        }
      }

      return [
        mode.slug,
        mode.name,
        mode.description,
        displaySource,
      ];
    });

    displayTable(['Slug', 'Name', 'Description', 'Source'], tableData);
  } catch (error: any) {
    showMessage('error', `Error listing modes: ${error.message}`);
  }
}

export function registerManageListModesCommand(program: Command): void {
  program
    .command('list-modes')
    .description('List available modes (custom, system, or all).')
    .option('-s, --source <type>', 'Specify the source of modes to list (custom, system, all)', 'custom')
    .action(manageListModes);
}