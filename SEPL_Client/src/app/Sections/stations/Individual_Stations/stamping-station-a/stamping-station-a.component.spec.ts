import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StampingStationAComponent } from './stamping-station-a.component';

describe('StampingStationAComponent', () => {
  let component: StampingStationAComponent;
  let fixture: ComponentFixture<StampingStationAComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StampingStationAComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StampingStationAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
