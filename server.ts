import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for scanning receipts
  app.post("/api/scan-receipt", upload.single('receipt'), async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
         return res.status(500).json({ success: false, message: "Gemini API key is missing." });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image file provided." });
      }

      const ai = new GoogleGenAI({ 
         apiKey: process.env.GEMINI_API_KEY,
         httpOptions: {
            headers: { 'User-Agent': 'aistudio-build' }
         }
      });

      const base64Data = req.file.buffer.toString('base64');
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: base64Data
              }
            },
            {
              text: "Extract the total amount, expense category, and description/merchant name from this receipt image. " +
                    "For category, choose one of these that fits best: Makanan & Minuman, Transportasi, Belanja, Tagihan, Hiburan, Lainnya. " +
                    "Return ONLY valid JSON data according to the schema provided."
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: {
                type: Type.NUMBER,
                description: "The total amount extracted from the receipt."
              },
              category: {
                type: Type.STRING,
                description: "The category that best matches the expense."
              },
              description: {
                type: Type.STRING,
                description: "The merchant name or description of the items."
              }
            },
            required: ["amount", "category", "description"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      res.json({ success: true, data });
    } catch (err: any) {
      console.error('Scan receipt error:', err);
      res.status(500).json({ success: false, message: err.message || "Gagal memindai struk." });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
