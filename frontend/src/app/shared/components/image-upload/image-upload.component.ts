// image-upload.component.ts
import { Component, Output, EventEmitter, HostListener, Input } from '@angular/core';
import { ImageService, UploadResponse } from '../../../core/image/image.service';
import { NgIf } from '@angular/common';
import { OrangButtonComponent } from '../orang-button/orang-button.component';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  imports: [NgIf, OrangButtonComponent],
  styleUrls: ['./image-upload.component.scss'],
})
export class ImageUploadComponent {
  @Input() buttonText = 'Upload Image';

  @Output() imageUploaded = new EventEmitter<string>(); // Emits the image ID
  @Output() uploadStarted = new EventEmitter<void>();
  @Output() uploadFailed = new EventEmitter<string>(); // Emits error message
  
  isOpen = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploading = false;
  uploadProgress = 0;
  uploadResult: UploadResponse | null = null;
  errorMessage: string | null = null;
  isDragging = false;
  
  constructor(private imageService: ImageService) { }

  // Open the upload modal
  openUpload(): void {
    this.isOpen = true;
    this.resetForm();
  }

  // Close the upload modal
  closeUpload(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isOpen = false;
    this.resetForm();
  }

  // Reset form state
  private resetForm(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.uploadResult = null;
    this.errorMessage = null;
    this.uploadProgress = 0;
    this.isDragging = false;
  }

  // Remove selected file
  removeFile(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.uploadResult = null;
  }

  // Drag and drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.selectedFile = event.dataTransfer.files[0];
      this.createPreview(this.selectedFile);
    }
  }

  // File selection handler
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadResult = null;
      this.errorMessage = null;
      this.uploadProgress = 0;
      
      // Create preview
      this.createPreview(this.selectedFile);
    }
  }

  // Create image preview
  createPreview(file: File): void {
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.imagePreview = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  }

  // Upload file
  upload(): void {
    if (!this.selectedFile) return;
    
    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadResult = null;
    this.errorMessage = null;
    
    // Emit upload started event
    this.uploadStarted.emit();
    
    this.imageService.uploadImage(this.selectedFile).subscribe({
      next: (response) => {
        this.uploadResult = response;
        this.isUploading = false;
        
        // Emit the uploaded image ID to parent component
        this.imageUploaded.emit(response.id);
        console.log('Upload successful, image ID:', response.id);
      },
      error: (error) => {
        const errorMsg = 'Upload failed. Please try again.';
        this.errorMessage = errorMsg;
        this.isUploading = false;
        
        // Emit error to parent component
        this.uploadFailed.emit(errorMsg);
        console.error('Upload error:', error);
      }
    });
  }

  // Get formatted file size
  get fileSize(): string {
    if (!this.selectedFile) return '';
    
    const size = this.selectedFile.size;
    if (size < 1024) return size + ' bytes';
    if (size < 1048576) return (size / 1024).toFixed(2) + ' KB';
    return (size / 1048576).toFixed(2) + ' MB';
  }

  // Close modal on Escape key
  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.isOpen) {
      this.closeUpload();
    }
  }
}