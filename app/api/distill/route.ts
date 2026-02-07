import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import { masterSchema, DApp } from '@/lib/schema';

export async function POST(req: NextRequest) {
  // Security Check: Validate API Key
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Define paths and read master data file
    const dataDir = path.join(process.cwd(), 'data');
    const collectionsDir = path.join(dataDir, 'collections');
    const masterJsonPath = path.join(dataDir, 'master.json');

    const masterJsonContent = await fs.readFile(masterJsonPath, 'utf-8');
    const dapps: DApp[] = JSON.parse(masterJsonContent);

    // 2. Validate data with Zod schema
    masterSchema.parse(dapps);

    // 3. Clean the collections directory before writing new files
    await fs.emptyDir(collectionsDir);

    // 4. Group DApps by category and by chain
    const byCategory: { [key: string]: DApp[] } = {};
    const byChain: { [key: string]: DApp[] } = {};

    for (const dapp of dapps) {
      // Group by category
      if (!byCategory[dapp.category]) {
        byCategory[dapp.category] = [];
      }
      byCategory[dapp.category].push(dapp);

      // Group by chain
      if (!byChain[dapp.chain]) {
        byChain[dapp.chain] = [];
      }
      byChain[dapp.chain].push(dapp);
    }

    // 5. Write distilled JSON files
    const allWrites: Promise<void>[] = [];

    // Write category files
    for (const category in byCategory) {
      const filePath = path.join(collectionsDir, `${category}.json`);
      const fileContent = JSON.stringify(byCategory[category], null, 2);
      allWrites.push(fs.writeFile(filePath, fileContent));
    }

    // Write chain files
    for (const chain in byChain) {
        const filePath = path.join(collectionsDir, `${chain}.json`);
        const fileContent = JSON.stringify(byChain[chain], null, 2);
        allWrites.push(fs.writeFile(filePath, fileContent));
    }
    
    // Write a file with all dapps as well
    const allDappsPath = path.join(collectionsDir, 'all.json');
    allWrites.push(fs.writeFile(allDappsPath, JSON.stringify(dapps, null, 2)));

    await Promise.all(allWrites);
    
    const totalCollections = Object.keys(byCategory).length + Object.keys(byChain).length + 1;

    return NextResponse.json({
      message: `Successfully distilled master file into ${totalCollections} collections.`,
      categories: Object.keys(byCategory),
      chains: Object.keys(byChain),
    });

  } catch (error) {
    console.error('Error in /api/distill:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: 'An internal error occurred.', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unknown error occurred.' }, { status: 500 });
  }
}
