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

    const result = await generateText({
      model: "google/gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extrait tout le texte visible dans cette image. Retourne uniquement le texte, sans commentaire ni explication.",
            },
            {
              type: "image",
              image: base64,
            },
          ],
        },
      ],
    })

    console.log("[v0] Image text extraction successful with Gemini, length:", result.text.length)
    return result.text
  } catch (error) {
    console.error("[v0] Image text extraction error:", error)
    return ""
  }
}
