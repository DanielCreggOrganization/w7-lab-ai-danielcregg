import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomePage {
  prompt = 'Provide an example recipe for the baked goods in the image';
  output = '';
  imageLoadError: string | null = null;
  isLoading = false;

  availableImages = [
    { url: 'assets/images/baked_goods_1.jpg', label: 'Baked Good 1' },
    { url: 'assets/images/baked_goods_2.jpg', label: 'Baked Good 2' },
    { url: 'assets/images/baked_goods_3.jpg', label: 'Baked Good 3' }
  ];

  selectedImage = this.availableImages[0].url;

  get formattedOutput() {
    return this.output.replace(/\n/g, '<br>');
  }

  selectImage(url: string) {
    this.selectedImage = url;
  }

  handleImageError(error: any) {
    console.error('Image load error:', error);
    this.imageLoadError = 'Failed to load image. Please check the path: ' + this.selectedImage;
  }

  handleImageLoad() {
    console.log('Image loaded successfully');
    this.imageLoadError = null;
  }

  async onSubmit() {
    this.isLoading = true;
    
    try {
      const response = await fetch(this.selectedImage);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const base64data = await this.blobToBase64(blob);
      const base64String = base64data.split(',')[1];

      const genAI = new GoogleGenerativeAI(environment.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

      const response2 = await result.response;
      this.output = response2.text();
      
    } catch (e) {
      this.output = 'Error: ' + e;
    } finally {
      this.isLoading = false;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}