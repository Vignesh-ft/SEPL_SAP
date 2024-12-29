import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StampingStationBComponent } from './stamping-station-b.component';

describe('StampingStationBComponent', () => {
  let component: StampingStationBComponent;
  let fixture: ComponentFixture<StampingStationBComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StampingStationBComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StampingStationBComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
