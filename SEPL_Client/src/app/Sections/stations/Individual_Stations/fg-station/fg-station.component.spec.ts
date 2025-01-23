import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FgStationComponent } from './fg-station.component';

describe('FgStationComponent', () => {
  let component: FgStationComponent;
  let fixture: ComponentFixture<FgStationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FgStationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FgStationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
