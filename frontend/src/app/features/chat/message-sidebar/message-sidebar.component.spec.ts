import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageSidebarComponent } from './message-sidebar.component';

describe('MessageSidebarComponent', () => {
  let component: MessageSidebarComponent;
  let fixture: ComponentFixture<MessageSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
