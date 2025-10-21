import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CultivoDetailPage } from './cultivo-detail.page';

describe('CultivoDetailPage', () => {
  let component: CultivoDetailPage;
  let fixture: ComponentFixture<CultivoDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CultivoDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
