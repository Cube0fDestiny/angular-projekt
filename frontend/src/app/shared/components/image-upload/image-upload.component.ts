// image-upload.component.ts
import { Component, Output, EventEmitter, Input, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { ImageService, UploadResponse } from '../../../core/image/image.service';
import { NgIf } from '@angular/common';
import { OrangButtonComponent } from '../orang-button/orang-button.component';
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  imports: [NgIf, OrangButtonComponent, OverlayModule],
  styleUrls: ['./image-upload.component.scss'],
})
export class ImageUploadComponent implements OnDestroy {
  @Input() buttonText = 'Upload Image';
  @ViewChild('uploadTemplate') uploadTemplate!: TemplateRef<any>;

  @Output() imageUploaded = new EventEmitter<string>();
  @Output() uploadStarted = new EventEmitter<void>();
  @Output() uploadFailed = new EventEmitter<string>();
  
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploading = false;
  uploadProgress = 0;
  uploadResult: UploadResponse | null = null;
  errorMessage: string | null = null;
  isDragging = false;
  
  private overlayRef: OverlayRef | null = null;
  
  constructor(
    private imageService: ImageService,
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef
  ) { }

  // Open the upload modal using Overlay
  openUpload(): void {
    this.resetForm();
    
    // Close any existing overlay first
    this.closeOverlay();
    
    // Create overlay position strategy
    const positionStrategy = this.overlay
      .position()
      .global()
      .centerHorizontally()
      .centerVertically();
    
    // Create overlay config
    const overlayConfig = {
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      panelClass: 'image-upload-overlay-panel',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy
    };

    // Create overlay
    this.overlayRef = this.overlay.create(overlayConfig);

    // Attach the template to overlay
    const portal = new TemplatePortal(this.uploadTemplate, this.viewContainerRef);
    this.overlayRef.attach(portal);

    // Close on backdrop click
    this.overlayRef.backdropClick().subscribe(() => {
      this.closeUpload();
    });

    // Close on escape key
    this.overlayRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        this.closeUpload();
      }
    });
  }

  // Close the upload modal
  closeUpload(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.closeOverlay();
    this.resetForm();
  }

  // Close overlay if exists
  private closeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
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
    this.errorMessage = null;
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
      this.handleFileSelection(event.dataTransfer.files[0]);
    }
  }

  // File selection handler
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  // Handle file selection (common method)
  private handleFileSelection(file: File): void {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      this.errorMessage = 'Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP, SVG).';
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.errorMessage = 'File is too large. Maximum size is 10MB.';
      return;
    }

    this.selectedFile = file;
    this.uploadResult = null;
    this.errorMessage = null;
    this.uploadProgress = 0;
    
    // Create preview
    this.createPreview(file);
  }

  // Create image preview
  private createPreview(file: File): void {
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
    
    // Simulate progress (optional)
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      }
    }, 100);
    
    this.imageService.uploadImage(this.selectedFile).subscribe({
      next: (response) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        this.uploadResult = response;
        this.isUploading = false;
        
        // Emit the uploaded image ID to parent component
        this.imageUploaded.emit(response.id);
        
        // Auto-close after successful upload (optional)
        setTimeout(() => {
          this.closeUpload();
        }, 2000);
      },
      error: (error) => {
        clearInterval(progressInterval);
        const errorMsg = error.error?.message || 'Upload failed. Please try again.';
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

  // Get file type (formatted)
  get fileType(): string {
    if (!this.selectedFile) return '';
    
    const type = this.selectedFile.type;
    return type.split('/')[1]?.toUpperCase() || type;
  }

  ngOnDestroy(): void {
    this.closeOverlay();
  }
}