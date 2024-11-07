// home.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../environments/environment';

/**
 * Interface defining the structure of a baked good item
 * Used for type safety when handling image data
 */
interface BakedGood {
  url: string;    // Path to the image file
  label: string;  // Display name for the image
}

/**
 * HomePage Component
 * A standalone component that allows users to select baked goods images
 * and generate recipes using the Gemini AI API
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomePage {
  // Constants for configuration
  readonly MODEL_NAME = 'gemini-1.5-flash';  // Gemini AI model name
  readonly DEFAULT_PROMPT = 'Provide an example recipe for the baked goods in the image';

  // Component state properties
  prompt = this.DEFAULT_PROMPT;     // User input prompt
  output = '';                      // AI generated output
  isLoading = false;                // Loading state flag
  imageLoadError: string | null = null;  // Error message for image loading

  /**
   * Array of available baked good images
   * Each image has a URL and a display label
   */
  availableImages: BakedGood[] = [
    { url: 'assets/images/baked_goods_1.jpg', label: 'Baked Good 1' },
    { url: 'assets/images/baked_goods_2.jpg', label: 'Baked Good 2' },
    { url: 'assets/images/baked_goods_3.jpg', label: 'Baked Good 3' }
  ];

  // Currently selected image, initialized to the first image
  selectedImage = this.availableImages[0].url;

  /**
   * Formats the output text by replacing newlines with HTML break tags
   * Used for proper display in the template
   */
  get formattedOutput() {
    return this.output.replace(/\n/g, '<br>');
  }

  /**
   * Handles image selection
   * Updates the selected image and clears any previous errors
   */
  selectImage(url: string) {
    this.selectedImage = url;
    this.imageLoadError = null;
  }

  /**
   * Handles image loading errors
   * Sets an error message when an image fails to load
   */
  handleImageError() {
    this.imageLoadError = 'Failed to load image. Please check the path: ' + this.selectedImage;
  }

  /**
   * Handles successful image loading
   * Clears any existing error messages
   */
  handleImageLoad() {
    this.imageLoadError = null;
  }

  /**
   * Main submit handler for generating recipes
   * Processes the selected image and sends it to Gemini AI
   */
  async onSubmit() {
    // Prevent multiple submissions
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.output = '';
    
    try {
      // Convert image to base64 format
      const base64String = await this.getImageAsBase64(this.selectedImage);
      
      // Initialize the Gemini AI client
      const genAI = new GoogleGenerativeAI(environment.apiKey);
      const model = genAI.getGenerativeModel({ model: this.MODEL_NAME });

      // Send request to Gemini AI
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { 
              inlineData: { 
                mimeType: 'image/jpeg', 
                data: base64String
              } 
            },
            { text: this.prompt }
          ]
        }]
      });

      // Update the output with the generated recipe
      this.output = result.response.text();
    } catch (e) {
      console.error('Error:', e);
      this.output = `Error: ${e instanceof Error ? e.message : 'Unknown error occurred'}`;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Converts an image URL to a base64 string
   * @param imageUrl The URL of the image to convert
   * @returns Promise resolving to the base64 string (without data URL prefix)
   */
  private async getImageAsBase64(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const base64Data = await this.blobToBase64(blob);
    return base64Data.split(',')[1];  // Remove the data URL prefix
  }

  /**
   * Converts a Blob to a base64 string
   * @param blob The Blob to convert
   * @returns Promise resolving to the base64 string (including data URL prefix)
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}