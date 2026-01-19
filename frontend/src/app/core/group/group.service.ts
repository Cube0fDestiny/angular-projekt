import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Group, GroupMember, ApiResponse, UpdateGroupData, CreateGroupData, ChangeUserMemberStatus, GroupApplication } from '../../shared/models/group.model';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly apiUrl = 'http://localhost:3000/groups';

  constructor(private http: HttpClient) {}

  // 1. Get all groups
  getAllGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiUrl}/`);
  }

  // 2. Get groups by ID
  getGroupById(id: string): Observable<Group> {
    return this.http.get<Group>(`${this.apiUrl}/${id}`);
  }

  // 3. Get user's groups (created and followed)
  getUserGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiUrl}/user-groups`);
  }

  // 4. Create new groups
  createGroup(Data: CreateGroupData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/`, Data);
  }

  // 5. Update groups
  updateGroup(id: string, Data: UpdateGroupData): Observable<Group> {
    return this.http.put<Group>(`${this.apiUrl}/${id}`, Data);
  }

  // 6. Delete group (soft delete)
  deleteGroup(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  // 7. Send join group request
  sendJoinGroupRequest(id: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/${id}/join`, {});
  }

  // 8. Get group members
  getGroupMembers(id: string): Observable<GroupMember[]> {
    return this.http.get<GroupMember[]>(`${this.apiUrl}/${id}/get_members`);
  }

  leaveGroup(id: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/${id}/leave`, {});
  }

  alterGourpMember(id: string, statusChange: ChangeUserMemberStatus): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/${id}/alter_member`, statusChange);
  }

  getGroupApplications(id: string): Observable<GroupApplication[]> {
    return this.http.get<GroupApplication[]>(`${this.apiUrl}/${id}/applications`);
  }

}