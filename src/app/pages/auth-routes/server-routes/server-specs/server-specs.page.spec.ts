import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { ServerSpecsPage } from './server-specs.page'

describe('ServerSpecsPage', () => {
  let component: ServerSpecsPage
  let fixture: ComponentFixture<ServerSpecsPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServerSpecsPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerSpecsPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
