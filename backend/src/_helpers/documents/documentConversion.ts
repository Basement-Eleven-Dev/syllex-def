import { spawn } from "child_process";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export const getConvertedDocument = async (textContent: string, filename: string, toExtension: string): Promise<Buffer> => {
    let sourceFilePath = path.join('tmp', filename)
    let destinationFilePath = path.join('tmp', filename + '.' + toExtension)
    await writeFile(sourceFilePath, textContent);
    const args = ['-i', sourceFilePath, '-o', destinationFilePath];

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