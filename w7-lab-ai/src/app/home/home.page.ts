// home.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Baking with Gemini</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form (ngSubmit)="onSubmit()">
        <!-- Image selection grid -->
        <ion-grid>
          <ion-row>
            <ion-col size="12" sizeMd="4" *ngFor="let img of availableImages">
              <ion-card 
                [class.selected]="selectedImage === img.url"
                (click)="selectImage(img.url)"
                class="image-card"
              >
                <ion-img 
                  [src]="img.url"
                  class="baked-goods-image"
                ></ion-img>
                <ion-card-content>
                  <ion-radio-group [(ngModel)]="selectedImage" name="imageSelect">
                    <ion-item lines="none">
                      <ion-label>{{ img.label }}</ion-label>
                      <ion-radio [value]="img.url" slot="start"></ion-radio>
                    </ion-item>
                  </ion-radio-group>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Debug info -->
        <ion-text color="danger" *ngIf="imageLoadError">
          <p>{{ imageLoadError }}</p>
        </ion-text>
        
        <ion-card>
          <ion-card-content>
            <ion-item>
              <ion-textarea
                [(ngModel)]="prompt"
                name="prompt"
                label="Instructions"
                labelPlacement="floating"
                [autoGrow]="true"
                rows="2"
              ></ion-textarea>
            </ion-item>

            <ion-button 
              type="submit" 
              expand="block"
              class="ion-margin-top"
              [disabled]="isLoading"
            >
              <ion-icon name="cafe-outline" slot="start"></ion-icon>
              {{ isLoading ? 'Generating...' : 'Generate Recipe' }}
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Output display -->
        <ion-card *ngIf="output">
          <ion-card-header>
            <ion-card-title>Generated Recipe</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-text>
              <p [innerHTML]="formattedOutput"></p>
            </ion-text>
          </ion-card-content>
        </ion-card>

        <!-- Loading indicator -->
        <ion-progress-bar 
          type="indeterminate" 
          *ngIf="isLoading"
        ></ion-progress-bar>
      </form>
    </ion-content>

    <style>
      .image-card {
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .image-card.selected {
        border: 2px solid var(--ion-color-primary);
        transform: translateY(-2px);
      }

      .baked-goods-image {
        width: 100%;
        height: auto;
        object-fit: contain;
        aspect-ratio: 4/3;
      }

      ion-card {
        margin-bottom: 16px;
      }

      /* Make radio buttons more prominent */
      ion-radio {
        margin-right: 8px;
      }

      /* Responsive grid adjustments */
      @media (max-width: 768px) {
        .baked-goods-image {
          aspect-ratio: 3/2;
        }
      }
    </style>
  `,
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