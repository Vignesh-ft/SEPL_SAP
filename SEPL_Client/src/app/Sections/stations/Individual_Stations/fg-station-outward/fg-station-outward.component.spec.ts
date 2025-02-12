import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FgStationOutwardComponent } from './fg-station-outward.component';

describe('FgStationOutwardComponent', () => {
  let component: FgStationOutwardComponent;
  let fixture: ComponentFixture<FgStationOutwardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FgStationOutwardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FgStationOutwardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
