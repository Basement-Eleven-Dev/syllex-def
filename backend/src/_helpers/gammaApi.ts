import { getSecret } from "./getDatabase";


type HeaderFooter = {
    type: 'cardNumber' | 'image' | 'text',
    value?: string,
    source?: 'themeLogo' | 'custom',
    src?: string,
    size?: 'sm' | 'md' | 'lg' | 'xl'
}
type HeadersFooters = {
    topLeft?: HeaderFooter,
    topRight?: HeaderFooter,
    topCenter?: HeaderFooter,
    bottomRight?: HeaderFooter,
    bottomLeft?: HeaderFooter,
    bottomCenter?: HeaderFooter,
    hideFromFirstCard?: boolean,
    hideFromLastCard?: boolean
}

export type GammaInput = {
    inputText: string,
    textMode: 'generate' | 'condense' | 'preserve',
    exportAs: 'pptx' | 'pdf',
    format?: 'presentation' | 'document' | 'webpage' | 'social', //default presentation
    themeId?: string,
    numCards?: number //default 10, from 1 to 75
    cardSplit?: 'auto' | 'inputTextBreaks', //default auto
    additionalInstructions?: string //1-1000 characters
    folderIds?: string[], //path of the file in gamma
    textOptions?: {
        amount?: 'brief' | 'medium' | 'detailed' | 'extensive',
        tone?: string, //1-500,
        audience?: string, //1-500
        language?: string
    },
    imageOptions?: {
        source?: 'aiGenerated' | 'pictographic' | 'unsplash' | 'webAllImages' | 'webFreeToUse' | 'webFreeToUseCommercially' | 'giphy' | 'placeholder' | 'noImages', //default aiGenerated
        model?: string, //image models in https://developers.gamma.app/reference/image-model-accepted-values
        style?: string //1-500
    },
    cardOptions?: {
        headerFooter?: HeadersFooters,
        dimensions?: 'fluid' | '16x9' | '4x3' | 'pageless' | 'letter' | 'a4' | '1x1' | '4x5' | '9x16' // depends on format. presentation: fluid (default), 16x9, 4x3; document: fluid (default), pageless, letter, a4; social: 1x1, 4x5 (default), 9x16
    },
    sharingOptions?: {
        workspaceAccess?: 'noAccess' | 'view' | 'comment' | 'edit' | 'fullAccess',
        externalAccess?: 'noAccess' | 'view' | 'comment' | 'edit'
    }
}

export type GammaGenerationJobOutput = {
    generationId: string
}

export type GammaGeneratedSlideOutput = {
    exportUrl?: string
    /* Not complete


        {
  "generationId": "RvaMly68CpEgLYH5U6wsY",
  "status": "completed",
  "gammaId": "g_px03hjgtf8um4b9",
  "gammaUrl": "https://gamma.app/docs/tih1o6jv8o9yd1o",
  "exportUrl": "https://assets.api.gamma.app/export/pptx/tih1o6jv8o9yd1o/e1e3f0cfd092d0d6519406403184b8ed/Untitled.pptx",
  "credits": {
    "deducted": 23,
    "remaining": 7950
  }
}


    */
}


export const startSlidedeckGeneration = async (input: GammaInput): Promise<GammaGenerationJobOutput> => {
    const gammaApiKey = await getSecret('gamma-api-key');
    const res = await fetch('https://public-api.gamma.app/v1.0/generations', {
        method: "post",
        body: JSON.stringify(input),
        headers: {
            'X-API-KEY': gammaApiKey
        }
    })
    const output = await res.json() as GammaGenerationJobOutput
    return output;
}

export const getGammaExportUrl = async (generationId: string): Promise<string | undefined> => {
    const gammaApiKey = await getSecret('gamma-api-key');
    const res = await fetch('https://public-api.gamma.app/v1.0/generations/' + generationId, {
        method: "get",
        headers: {
            'X-API-KEY': gammaApiKey
        }
    })
    const output = await res.json() as GammaGeneratedSlideOutput
    return output.exportUrl;
}