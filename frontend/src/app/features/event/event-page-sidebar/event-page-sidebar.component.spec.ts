import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventPageSidebarComponent } from './event-page-sidebar.component';

describe('ProfilePageSidebarComponent', () => {
  let component: EventPageSidebarComponent;
  let fixture: ComponentFixture<EventPageSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventPageSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventPageSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
