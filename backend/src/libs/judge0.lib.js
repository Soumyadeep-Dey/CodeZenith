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
  const url = `${process.env.SULU_API_URL}/submissions/batch`;

  const MAX_RETRIES = 15;
  const INTERVAL = 1500;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(url, {
        params: {
          tokens: tokens.join(","),
          fields: "stdout,stderr,status,source_code,expected_output",
          base64_encoded: false,
        },
        headers: {
          "X-RapidAPI-Key": process.env.SULU_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      });

      const results = response.data.submissions;

      const processing = results.some(
        (s) => s.status.id === 1 || s.status.id === 2
      );

      if (!processing) return results;

      await sleep(INTERVAL);
    } catch (err) {
      console.error("Poll error:", err.response?.data || err.message);
      await sleep(INTERVAL);
    }
  }

  return null;
};



export async function submitbatch(submissions) {
  const url = `${process.env.SULU_API_URL}/submissions/batch`;

  const { data } = await axios.post(
    url,
    { submissions },
    {
      params: {
        base64_encoded: false,
        wait: false,
      },
      headers: {
        "X-RapidAPI-Key": process.env.SULU_API_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        "Content-Type": "application/json",
      },
    }
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