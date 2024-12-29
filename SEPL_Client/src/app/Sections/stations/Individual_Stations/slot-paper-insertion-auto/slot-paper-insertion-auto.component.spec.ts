import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotPaperInsertionAutoComponent } from './slot-paper-insertion-auto.component';

describe('SlotPaperInsertionAutoComponent', () => {
  let component: SlotPaperInsertionAutoComponent;
  let fixture: ComponentFixture<SlotPaperInsertionAutoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotPaperInsertionAutoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlotPaperInsertionAutoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
