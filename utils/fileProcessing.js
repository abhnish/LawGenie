import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extract text content from different file types
 * @param {string} filePath - Path to the file
 * @param {string} mimetype - MIME type of the file
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromFile(filePath, mimetype) {
  try {
    if (mimetype === 'application/pdf') {
      return await extractTextFromPdf(filePath);
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/docx'
    ) {
      return await extractTextFromDocx(filePath);
    } else {
      throw new Error(`Unsupported file type: ${mimetype}`);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw error;
  }
}

/**
 * Extract text from PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromPdf(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

/**
 * Extract text from DOCX file
 * @param {string} filePath - Path to the DOCX file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw error;
  }
}
