import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupPageHeaderComponent } from './group-page-header.component';

describe('GroupPageHeaderComponent', () => {
  let component: GroupPageHeaderComponent;
  let fixture: ComponentFixture<GroupPageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupPageHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupPageHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
