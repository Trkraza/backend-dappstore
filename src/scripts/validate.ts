// D:\projects\dapp-store\backend-dappstore\src\scripts\validate.ts

import fs from 'fs-extra';
import path from 'path';
import { metaJsonSchema } from '../../lib/schema';

// Main function to validate all DApp meta.json files
async function validateDAppMeta(): Promise<void> {
  const appsDirPath = path.join(process.cwd(), 'data', 'apps');
  let hasErrors = false;

  console.log('Starting DApp meta.json validation...');

  // Ensure the data/apps directory exists
  if (!(await fs.pathExists(appsDirPath))) {
    console.error(`Error: Directory not found at ${appsDirPath}`);
    process.exit(1);
  }

  // Find all meta.json files
  const metaJsonPaths: string[] = [];
  const findMetaJsonFiles = async (currentDir: string) => {
    const items = await fs.readdir(currentDir);
    for (const item of items) {
      const itemPath = path.join(currentDir, item);
      const stat = await fs.stat(itemPath);
      if (stat.isDirectory()) {
        await findMetaJsonFiles(itemPath);
      } else if (stat.isFile() && item === 'meta.json') {
        metaJsonPaths.push(itemPath);
      }
    }
  };

  await findMetaJsonFiles(appsDirPath);

  if (metaJsonPaths.length === 0) {
    console.warn('No meta.json files found to validate.');
    // Exit with success if no files to validate, or warn and exit with error based on strictness
    // For now, treat as success if no files, as it's not a validation failure per se.
    process.exit(0);
  }

  for (const metaJsonPath of metaJsonPaths) {
    try {
      const fileContent = await fs.readFile(metaJsonPath, 'utf-8');
      const jsonData = JSON.parse(fileContent);

      // 1. Validate against Zod schema
      const parsedData = metaJsonSchema.parse(jsonData);

      // 2. Validate slug matches folder name
      const folderName = path.basename(path.dirname(metaJsonPath));
      if (parsedData.slug !== folderName) {
        hasErrors = true;
        console.error(
          `Validation Error in ${metaJsonPath}: Slug mismatch. Expected "${folderName}", got "${parsedData.slug}".`
        );
      }

    } catch (error) {
      hasErrors = true;
      if (error instanceof Error) {
        console.error(`Validation Error in ${metaJsonPath}: ${error.message}`);
      } else {
        console.error(`Validation Error in ${metaJsonPath}: An unknown error occurred.`);
      }
    }
  }

  if (hasErrors) {
    console.error(`
DApp meta.json validation FAILED.`);
    process.exit(1);
  } else {
    console.log(`
DApp meta.json validation PASSED successfully.`);
    process.exit(0);
  }
}

validateDAppMeta();
