require("dotenv").config();
const express = require("express");
const { db } = require("./src/config/firebase");
const { getDocs, collection, setDoc, doc } = require("firebase/firestore");
const cors = require("cors");

const { TranslationServiceClient } = require("@google-cloud/translate");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", async (_, res) => {
  const translations = [];
  const querySnapShot = await getDocs(collection(db, "translations"));
  querySnapShot.forEach((doc) => {
    translations.push({
      id: doc.id,
      ...doc.data(),
    });
  });
  return res.json(translations);
});

async function translateText(text, sourceLanguage, targetLanguage) {
  let translatedText = "";
  // Instantiates a client
  const translationClient = new TranslationServiceClient();

  const projectId = "react-native-translator-5b8a3";
  const location = "global";
  // Construct request
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: "text/plain", // mime types: text/plain, text/html
    sourceLanguageCode: sourceLanguage,
    targetLanguageCode: targetLanguage,
  };

  // Run request
  const [response] = await translationClient.translateText(request);

  for (const translation of response.translations) {
    translatedText = translation.translatedText;
  }

  return {
    text,
    translatedText,
    targetLanguage,
    sourceLanguage,
  };
}

app.post("/api/v1/translate", async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body;
  const response = await translateText(text, sourceLanguage, targetLanguage);

  //save it in database
  const newTranslationRef = doc(collection(db, "translations"));

  await setDoc(newTranslationRef, response);

  return res.json(response);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`server is listening on port ${PORT}`));
