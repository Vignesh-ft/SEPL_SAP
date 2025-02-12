import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FgStationInwardComponent } from './fg-station-inward.component';

describe('FgStationInwardComponent', () => {
  let component: FgStationInwardComponent;
  let fixture: ComponentFixture<FgStationInwardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FgStationInwardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FgStationInwardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
