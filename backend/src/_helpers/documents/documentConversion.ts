import { spawn } from "child_process";
import { readFile, writeFile } from "fs/promises";
import path from "path";

/**
 * REQUIRE PANDOC EXTENSION LAYER
 * @param textContent 
 * @param filename 
 * @param toExtension 
 * @returns 
 */
export const getConvertedDocument = async (textContent: string, sourceFileName: string, destinationFileName: string): Promise<Buffer> => {
    let sourceFilePath = path.join('tmp', sourceFileName)
    let destinationFilePath = path.join('tmp', destinationFileName)

    await writeFile(sourceFilePath, textContent);

    const args = [
        '-i', sourceFilePath,
        '-o', destinationFilePath
    ];

    const pandocProcess = spawn("pandoc", args, {
        cwd: 'tmp', // Esegui in /tmp per gestire I/O
        stdio: ['pipe', 'pipe', 'pipe'] // Controlla gli stream
    });

    // 1. Gestione Output STDERR (Cruciale per il debug)
    pandocProcess.stderr.on('data', (data) => {
        console.error(`Pandoc STDERR: ${data}`);
    });

    // 2. Cattura Output STDOUT (Se pandoc scrive su stdout)
    let stdoutData = '';
    pandocProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
    });

    // 3. Promisificazione dell'uscita
    const exitCode = await new Promise((resolve, reject) => {
        pandocProcess.on('close', resolve);
        pandocProcess.on('error', reject);
    });

    if (exitCode !== 0) {
        throw new Error(`Pandoc failed with code ${exitCode}. STDERR: (vedi log)`);
    }
    return await readFile(destinationFilePath)
}