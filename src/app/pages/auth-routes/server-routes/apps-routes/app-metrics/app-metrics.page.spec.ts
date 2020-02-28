import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { AppMetricsPage } from './app-metrics.page'

describe('AppMetricsPage', () => {
  let component: AppMetricsPage
  let fixture: ComponentFixture<AppMetricsPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppMetricsPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppMetricsPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
