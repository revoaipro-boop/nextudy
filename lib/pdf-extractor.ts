export async function extractPDFText(file: File): Promise<string> {
  try {
    console.log("[v0] Starting client-side PDF extraction")
    console.log("[v0] File name:", file.name)
    console.log("[v0] File type:", file.type)
    console.log("[v0] File size:", file.size, "bytes")

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    console.log("[v0] PDF file converted to Uint8Array, length:", uint8Array.length, "bytes")

    const pdfjsLib = await import("pdfjs-dist")

    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

    console.log("[v0] PDF.js version:", pdfjsLib.version)
    console.log("[v0] PDF.js loaded with worker URL:", pdfjsLib.GlobalWorkerOptions.workerSrc)

    // Load PDF document with better error handling
    let pdf
    try {
      console.log("[v0] Attempting to load PDF document...")
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
      pdf = await loadingTask.promise
      console.log("[v0] PDF document loaded successfully")
    } catch (loadError) {
      console.error("[v0] PDF loading error details:", loadError)
      console.error("[v0] Error name:", (loadError as Error).name)
      console.error("[v0] Error message:", (loadError as Error).message)
      throw new Error(
        "Impossible de charger le fichier PDF. Le fichier est peut-être corrompu ou dans un format non supporté.",
      )
    }

    console.log("[v0] PDF loaded, pages:", pdf.numPages)

    let fullText = ""
    const failedPages: number[] = []
    let successfulPages = 0

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(" ")

        if (pageText.trim().length > 0) {
          fullText += pageText + "\n\n"
          successfulPages++
          console.log(`[v0] Extracted page ${pageNum}/${pdf.numPages}, length: ${pageText.length}`)
        } else {
          failedPages.push(pageNum)
          console.log(`[v0] Page ${pageNum} contains no text (likely image-only), skipping`)
        }
      } catch (pageError) {
        failedPages.push(pageNum)
        console.warn(`[v0] Failed to extract text from page ${pageNum} (likely contains only images):`, pageError)
        // Continue with next page
      }
    }

    console.log(`[v0] Extraction complete: ${successfulPages}/${pdf.numPages} pages extracted successfully`)
    if (failedPages.length > 0) {
      console.log(`[v0] Pages with no text or extraction errors (likely image-only): ${failedPages.join(", ")}`)
    }

    const trimmedText = fullText.trim()

    if (!trimmedText || trimmedText.length === 0) {
      throw new Error("Aucun texte détecté dans le fichier PDF. Veuillez importer un PDF contenant du texte.")
    }

    console.log("[v0] Total extracted text length:", trimmedText.length)
    return trimmedText
  } catch (error) {
    console.error("[v0] Error extracting PDF text:", error)
    if (error instanceof Error && error.message.includes("Aucun texte détecté")) {
      throw error
    }
    if (error instanceof Error && error.message.includes("Impossible de charger")) {
      throw error
    }
    throw new Error("Impossible d'extraire le texte du PDF. Le fichier est peut-être corrompu ou protégé.")
  }
}
