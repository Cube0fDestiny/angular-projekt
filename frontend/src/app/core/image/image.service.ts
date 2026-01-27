// image.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private apiUrl = `${environment.apiUrl}/images`;

  constructor(private http: HttpClient) { }

  uploadImage(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file, file.name);

    return this.http.post<UploadResponse>(this.apiUrl, formData);
  }

  getImage(id: string, options?: { w: number; h: number }): Observable<string> {
    return this.http.get(`/api/images/${id}`, {
      responseType: 'blob',
      params: options || {}
    }).pipe(
      map(blob => URL.createObjectURL(blob))
    );
  }

  deleteImage(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}