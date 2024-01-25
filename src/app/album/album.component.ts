import { Component, ElementRef } from '@angular/core';
import { FileUploadService } from '../Services/FileUploadService';
import { ChartDataset } from 'chart.js';

@Component({
  selector: 'app-album',
  templateUrl: './album.component.html',
  styleUrls: ['./album.component.css'],
})

export class AlbumComponent {

  categories: any[] = []; // Initialize categories array to empty
  selectedCategory: any;
  selectedImageIds: string[] = [];
  resp: any;
  selectedFiles!: FileList | null;
  selectedImage: string | ArrayBuffer | null = null; // To store the selected image for preview
  selectedDisplayCategory: string = 'ALL';
  constructor(private fileUploadService: FileUploadService) { }
  selectedImages: any[] = [];
  images: any[] = [];
  similarImages: any[] = []; // Array to store similar images

  ngOnInit() {
    this.getCategories()
    this.getImages();
  }

  selectImage(image: any) {
    this.selectedImages.push(image);
    console.log(this.selectedImages);
  }

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  toggleImageSelection(event: any, imageId: string) {
    if (event.target.checked) {
      this.selectedImageIds.push(imageId);
    } else {
      this.selectedImageIds = this.selectedImageIds.filter(id => id !== imageId);
    }
  }

  onFileSelected(event: any) {
    this.selectedFiles = event.target.files;
    console.log('onselectfiles', this.selectedFiles);
  }
  addCategory() {
    const newCategory = prompt('Enter the name of the new category:');
    if (newCategory) {
      this.fileUploadService.addCategory(newCategory).subscribe(
        (res) => {
          console.log('Category added successfully:', res);
          this.categories.push(newCategory);
          this.getCategories()
        },
        (error) => {
          console.error('Error occurred:', error);
        }
      );
    }
  }
  getCategories() {
    this.fileUploadService.getCategories().subscribe(
      (res) => {
        console.log('Categories:', res);
        // Handle the categories here
        this.categories = res.map((category: any) => ({ id: category._id, name: category.name }));
        this.selectedCategory = this.categories[0];
        console.log('this.selectedCategory:', this.selectedCategory);
      },
      (error) => {
        console.error('Error occurred:', error);
      }
    );
  }

  deleteCategory(category: string) {
    console.log('category', category)
    if (confirm(`Are you sure you want to delete the category ?`)) {
      this.fileUploadService.deleteCategory(category).subscribe(
        (res) => {
          console.log('Category deleted successfully:', res);
          this.getCategories();
          this.selectedCategory = this.categories[0];
        },
        (error) => {
          console.error('Error occurred:', error);
        }
      );
    }
  }

  Selected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.selectedImage = reader.result; // Store selected image for preview
      };
      const formData = new FormData();
      formData.append('files', event.target.files[0]);

      this.fileUploadService.searchImages(formData).subscribe(
        (res) => {
          console.log('Search Results:', res);
          // Handle the search results here
          this.similarImages = res.map((image: any) => {
            const tasnime = `data:${image['image']["content_type"]};base64,${image['image']["image_data"]}`;
            // console.log('tasnime',tasnime)
            return tasnime
          });
        },
        (error) => {
          console.error('Error occurred:', error);
        }
      );
    }
  }

  getImages() {
    let userId = localStorage.getItem('userId');
    if (userId) {
      this.fileUploadService
        .getImagesByUserId(JSON.parse(userId))
        .subscribe((data: any[]) => {
          console.log('data', data);
          this.images = data.map(image => {
            return {
              imageData: `data:${image["content_type"]};base64,${image["image_data"]}`,
              id: image["_id"],
              category: image["category"]
            };
          });
        });
    }
  }

  uploadImages() {
    if (this.selectedFiles) {
      const formData = new FormData();

      let userId = localStorage.getItem('userId');

      if (userId) {
        formData.append('user', JSON.parse(userId));
        formData.append('category', this.selectedCategory.name);

        for (let i = 0; i < this.selectedFiles.length; i++) {
          const file = this.selectedFiles[i];
          formData.append('files', file);
          formData.append('filename', file.name);
          formData.append('contentType', file.type);
        }
        this.fileUploadService.sendtoFlask(formData).subscribe(
          (response) => {
            console.log('Upload success!', response);
            this.getImages();
          },
          (error) => {
            console.error('Upload error:', error);
          }
        );
      }
    }
  }
  deleteSelectedImages() {
    if (this.selectedImageIds.length === 0) {
      alert('Please select images to delete.');
      return;
    }
  
    if (confirm(`Are you sure you want to delete the selected images?`)) {
      for (const imageId of this.selectedImageIds) {
        this.fileUploadService.deleteImage(imageId).subscribe(
          res => {
            console.log(`Image with ID ${imageId} deleted successfully`);
            this.getImages(); // Refresh the image list after deletion
          },
          err => {
            console.log(`Error deleting image with ID ${imageId}:`, err);
          }
        );
      }
      this.selectedImageIds = []; // Clear the selected image IDs after deletion
    }
  }
  sendImagesTo() {
    if (this.selectedImages.length > 0) {
      const formData = new FormData();

      for (let image of this.selectedImages) {
        // Convert the base64 string back to a Blob
        let byteCharacters = atob(image.imageData.split(',')[1]);
        let byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        let byteArray = new Uint8Array(byteNumbers);
        let blob = new Blob([byteArray], { type: image.contentType });

        // Append the Blob to the FormData object
        formData.append('files', blob, image.filename);
      }
      console.log(formData)
      this.fileUploadService.sendtoapi(formData).subscribe(
        (response) => {
          console.log('Send to Flask!', response);
          this.resp = response;
          this.selectedImages = [];

        },
        (error) => {
          this.selectedImages = [];
          console.error('Eror Sending:', error);

        }
      );
    }
  }
  getDominantColor(color: number[]): string {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }


}
