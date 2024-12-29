import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContinuityTestAutoComponent } from './continuity-test-auto.component';

describe('ContinuityTestAutoComponent', () => {
  let component: ContinuityTestAutoComponent;
  let fixture: ComponentFixture<ContinuityTestAutoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContinuityTestAutoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContinuityTestAutoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
