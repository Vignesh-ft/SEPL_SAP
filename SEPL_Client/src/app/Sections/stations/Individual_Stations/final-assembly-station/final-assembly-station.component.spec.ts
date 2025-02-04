import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalAssemblyStationComponent } from './final-assembly-station.component';

describe('FinalAssemblyStationComponent', () => {
  let component: FinalAssemblyStationComponent;
  let fixture: ComponentFixture<FinalAssemblyStationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalAssemblyStationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinalAssemblyStationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
