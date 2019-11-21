import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { AvailableAppsListPage } from './available-apps-list.page'

describe('AvailableAppsPage', () => {
  let component: AvailableAppsListPage
  let fixture: ComponentFixture<AvailableAppsListPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AvailableAppsListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AvailableAppsListPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
