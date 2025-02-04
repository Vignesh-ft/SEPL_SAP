import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdiStationComponent } from './pdi-station.component';

describe('PdiStationComponent', () => {
  let component: PdiStationComponent;
  let fixture: ComponentFixture<PdiStationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdiStationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdiStationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
