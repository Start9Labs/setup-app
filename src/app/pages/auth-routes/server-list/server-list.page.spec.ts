import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { ServerListPage } from './server-list.page'

describe('ServerListPage', () => {
  let component: ServerListPage
  let fixture: ComponentFixture<ServerListPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServerListPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerListPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
