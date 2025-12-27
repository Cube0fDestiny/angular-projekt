import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilePageHeaderComponent } from './profile-page-header.component';

describe('ProfilePageHeaderComponent', () => {
  let component: ProfilePageHeaderComponent;
  let fixture: ComponentFixture<ProfilePageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePageHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilePageHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
