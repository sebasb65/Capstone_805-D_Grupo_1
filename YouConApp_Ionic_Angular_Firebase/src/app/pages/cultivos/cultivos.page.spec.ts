import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CultivosPage } from './cultivos.page';

describe('CultivosPage', () => {
  let component: CultivosPage;
  let fixture: ComponentFixture<CultivosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CultivosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
