import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotPaperInsertionMannualComponent } from './slot-paper-insertion-mannual.component';

describe('SlotPaperInsertionMannualComponent', () => {
  let component: SlotPaperInsertionMannualComponent;
  let fixture: ComponentFixture<SlotPaperInsertionMannualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotPaperInsertionMannualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlotPaperInsertionMannualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
