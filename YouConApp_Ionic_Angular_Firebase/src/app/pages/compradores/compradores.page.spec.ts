import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompradoresPage } from './compradores.page';

describe('CompradoresPage', () => {
  let component: CompradoresPage;
  let fixture: ComponentFixture<CompradoresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CompradoresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
