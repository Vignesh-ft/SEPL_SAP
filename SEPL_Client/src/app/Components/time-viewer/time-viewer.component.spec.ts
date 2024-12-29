import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeViewerComponent } from './time-viewer.component';

describe('TimeViewerComponent', () => {
  let component: TimeViewerComponent;
  let fixture: ComponentFixture<TimeViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
