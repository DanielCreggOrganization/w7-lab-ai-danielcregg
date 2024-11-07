import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // CommonModule for common Angular directives
import { FormsModule } from '@angular/forms'; // FormsModule for two-way data binding
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonProgressBar,
  IonText,
  IonRadioGroup,
  IonRadio,
  IonImg,
  IonTextarea,
  IonRippleEffect,
} from '@ionic/angular/standalone'; // Ionic standalone components for UI elements
import { GoogleGenerativeAI } from '@google/generative-ai'; // Gemini AI SDK imports and environment configuration
import { environment } from '../../environments/environment'; // Environment configuration for API key

/**
 * Main HomePage component
 * This standalone component handles:
 * - Image selection and display
 * - Recipe generation using Gemini AI
 * - User input and output display
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonProgressBar,
    IonText,
    IonRadioGroup,
    IonRadio,
    IonImg,
    IonTextarea,
    IonRippleEffect,
  ],
})
export class HomePage {
  /**
   * Configuration constants
   * MODEL_NAME: Specifies which Gemini AI model to use
   * DEFAULT_PROMPT: Initial prompt shown to users
   */
  readonly MODEL_NAME = 'gemini-1.5-flash';
  readonly DEFAULT_PROMPT = 'Provide an example recipe for the baked goods in the image';

  /**
   * Component State Properties
   * prompt: Current user input text
   * output: Generated recipe text from Gemini
   * isLoading: Tracks API request status
   */
  prompt = this.DEFAULT_PROMPT;
  output = '';
  isLoading = false;

  /**
   * Available images for recipe generation
   * Each image has a URL and display label
   * First image is selected by default
   */
  availableImages = [
    { url: 'assets/images/baked_goods_1.jpg', label: 'Baked Good 1' },
    { url: 'assets/images/baked_goods_2.jpg', label: 'Baked Good 2' },
    { url: 'assets/images/baked_goods_3.jpg', label: 'Baked Good 3' },
  ];

  // Default selected image
  selectedImage = this.availableImages[0].url;

  /**
   * Formats the AI output by replacing newlines with HTML break tags
   * Makes the output display properly in the template
   */
  get formattedOutput() {
    return this.output.replace(/\n/g, '<br>');
  }

  /**
   * Updates the selected image when user makes a selection
   * @param url - URL of the selected image
   */
  selectImage(url: string) {
    this.selectedImage = url;
  }

  /**
   * Main handler for recipe generation
   * 1. Converts selected image to base64
   * 2. Sends image and prompt to Gemini AI
   * 3. Updates UI with generated recipe
   */
  async onSubmit() {
    // Prevent multiple simultaneous submissions
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      // Step 1: Convert image to base64
      const response = await fetch(this.selectedImage);
      const blob = await response.blob();
      const base64data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Step 2: Initialize and call Gemini AI
      const genAI = new GoogleGenerativeAI(environment.apiKey);
      const model = genAI.getGenerativeModel({ model: this.MODEL_NAME });
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64data.split(',')[1],
                },
              },
              { text: this.prompt },
            ],
          },
        ],
      });

      // Step 3: Update UI with generated recipe
      this.output = result.response.text();
    } catch (e) {
      this.output = `Error: ${
        e instanceof Error ? e.message : 'Something went wrong'
      }`;
    }
    // Reset loading state
    this.isLoading = false;
  }
}
