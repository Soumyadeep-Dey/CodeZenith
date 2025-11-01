import axios from "axios";
import "dotenv/config";

const headers = {
    Authorization : `Bearer ${process.env.SULU_API_KEY}`,
}
export const getJudge0LanguageId = (language) =>{
    const languageMap = {
        "PYTHON": 71,
        "JAVA": 62,
        "JAVASCRIPT": 63,
    }

    return languageMap[language.toUpperCase()];
}

const sleep = (ms)=> new Promise((resolve)=> setTimeout(resolve , ms))


export const pollBatchResults = async (tokens) => {
    const tokensString = tokens.join(',');
    const pollUrl = `${process.env.SULU_API_URL}/submissions/batch?tokens=${tokensString}&base64_encoded=false&fields=status,stdout,stderr,expected_output,source_code`;

    const MAX_RETRIES = 10; // Poll a maximum of 10 times
    const POLL_INTERVAL = 1500; // Wait 1.5 seconds between polls

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await axios.get(pollUrl, {
                headers: {
                    'X-RapidAPI-Key': process.env.SULU_API_KEY,
                    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
                },
            });

            const results = response.data.submissions;

            // This is the crucial check. Status ID 1 is "In Queue", 2 is "Processing".
            // We check if ANY submission is still being processed.
            const isProcessing = results.some(r => r && (r.status.id === 1 || r.status.id === 2));

            if (!isProcessing) {
                // If nothing is processing, we have our final results.
                return results;
            }

            // If still processing, wait before the next attempt.
            await sleep(POLL_INTERVAL);

        } catch (error) {
            console.error(`Error polling results (attempt ${attempt + 1}):, error.response ? error.response.data : error.message`);
            // Optional: Decide if you want to stop on error or keep trying.
            // For now, we'll let it continue to the next retry.
            await sleep(POLL_INTERVAL);
        }
    }

    // If the loop finishes, it means we timed out.
    console.error(`Polling timed out for tokens: ${tokensString}`);
    // Return null to be caught by your controller's error handling.
    return null;
};


export async function submitbatch(
  submissions
) {
  const {data} = await axios.post(
    `${process.env.SULU_API_URL}/submissions/batch?base64_encoded=false`,
    {headers, submissions},
  );

  return data;
}

export function getLanguageName(languageId){
    const LANGUAGE_NAMES = {
        63: "JavaScript",
        71: "Python",
        62: "Java",
    }

    return LANGUAGE_NAMES[languageId] || "Unknown"
}