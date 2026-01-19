import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupPageSidebarComponent } from './group-page-sidebar.component';

describe('ProfilePageSidebarComponent', () => {
  let component: GroupPageSidebarComponent;
  let fixture: ComponentFixture<GroupPageSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupPageSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupPageSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
