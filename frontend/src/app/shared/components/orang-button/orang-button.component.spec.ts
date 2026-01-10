import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrangButtonComponent } from './orang-button.component';

describe('OrangButtonComponent', () => {
  let component: OrangButtonComponent;
  let fixture: ComponentFixture<OrangButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrangButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrangButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
