import { mount } from '@vue/test-utils'
import QueryCpp from '../../../../../etc/js/components/pages/queries/query-cpp.vue'

describe('query-cpp.vue', () => {
  describe('iteration code generation', () => {
    test('should use pointer (*) for optional terms', () => {
      const wrapper = mount(QueryCpp, {
        props: {
          result: {
            query_info: {
              terms: [{
                first: { symbol: 'Position', type: true },
                inout: 'in',
                oper: 'optional',
                src: { var: 'this' },
                has_value: true
              }]
            }
          }
        }
      })

      const iterationCode = wrapper.findAll('pre')[2].text()
      expect(iterationCode).toContain('Position*')
    })

    test('should use reference (&) for regular terms', () => {
      const wrapper = mount(QueryCpp, {
        props: {
          result: {
            query_info: {
              terms: [{
                first: { symbol: 'Position', type: true },
                inout: 'in',
                oper: 'and',
                src: { var: 'this' },
                has_value: true
              }]
            }
          }
        }
      })

      const iterationCode = wrapper.findAll('pre')[2].text()
      expect(iterationCode).toContain('Position&')
    })

    test('should handle multiple terms with mixed optional and regular', () => {
      const wrapper = mount(QueryCpp, {
        props: {
          result: {
            query_info: {
              terms: [
                {
                  first: { symbol: 'Position', type: true },
                  inout: 'in',
                  oper: 'optional',
                  src: { var: 'this' },
                  has_value: true
                },
                {
                  first: { symbol: 'Velocity', type: true },
                  inout: 'in',
                  oper: 'and',
                  src: { var: 'this' },
                  has_value: true
                }
              ]
            }
          }
        }
      })

      const iterationCode = wrapper.findAll('pre')[2].text()
      expect(iterationCode).toContain('Position*')
      expect(iterationCode).toContain('Velocity&')
    })
  })
})