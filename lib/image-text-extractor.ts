import { generateText } from "ai"

export async function extractTextFromImage(file: File): Promise<string> {
  try {
    console.log("[v0] Extracting text from image using Gemini:", file.name)

    const reader = new FileReader()
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const base64Data = base64.split(",")[1]

    const result = await generateText({
      model: "google/gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyse cette image et extrais TOUT le texte visible de manière structurée.

RÈGLES :
- Extrais chaque mot, chaque ligne, chaque annotation
- Conserve la structure (titres, paragraphes, listes)
- Pour les formules mathématiques, utilise la notation LaTeX si possible
- Pour les schémas, décris les éléments visuels importants
- Indique [illisible] si un texte n'est pas clair

Retourne le texte extrait en Markdown.`,
            },
            {
              type: "image",
              image: base64Data,
            },
          ],
        },
      ],
      maxTokens: 2500,
      temperature: 0.1, // Température basse pour précision
    })

    console.log("[v0] Image text extraction successful with Gemini, length:", result.text.length)
    return result.text
  } catch (error) {
    console.error("[v0] Image text extraction error:", error)
    return ""
  }
}
