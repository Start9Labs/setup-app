import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { ServerMetricsPage } from './server-metrics.page'

describe('ServerMetricsPage', () => {
  let component: ServerMetricsPage
  let fixture: ComponentFixture<ServerMetricsPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServerMetricsPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerMetricsPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
