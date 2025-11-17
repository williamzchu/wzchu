import Code from "../../Code"
import CodeFunc from "../../CodeFunc"

export default function Pipeline() {
const shader =`static float2 positions[3] = float2[](
    float2(0.0, -0.5),
    float2(0.5, 0.5),
    float2(-0.5, 0.5)
);

static float3 colors[3] = float3[](
    float3(1.0, 0.0, 0.0),
    float3(0.0, 1.0, 0.0),
    float3(0.0, 0.0, 1.0)
);

struct VertexOutput {
    float3 color;
    float4 sv_position : SV_Position;
};

[shader("vertex")]
VertexOutput vertMain(uint vid : SV_VertexID) {
    VertexOutput output;
    output.sv_position = float4(positions[vid], 0.0, 1.0);
    output.color = colors[vid];
    return output;
}

[shader("fragment")]
float4 fragMain(VertexOutput inVert) : SV_Target
{
    float3 color = inVert.color;
    return float4(color, 1.0);
}`

const read = `static std::vector<char> readFile(const std::string &filename)
{
    std::ifstream file(filename, std::ios::ate | std::ios::binary);
    if (!file.is_open())
    {
        throw std::runtime_error("failed to open file!");
    }
    std::vector<char> buffer(file.tellg());
    file.seekg(0, std::ios::beg);
    file.read(buffer.data(), static_cast<std::streamsize>(buffer.size()));
    file.close();
    return buffer;
}`

const pipeline = `void initVulkan()
{
    createInstance();
    setupDebugMessenger();
    createSurface();
    pickPhysicalDevice();
    createLogicalDevice();
    createSwapChain();
    createImageViews();
    createGraphicsPipeline();
}

void createGraphicsPipeline()
{
    vk::raii::ShaderModule shaderModule = createShaderModule(readFile("shaders/slang.spv"));

    vk::PipelineShaderStageCreateInfo vertShaderStageInfo{.stage = vk::ShaderStageFlagBits::eVertex, .module = shaderModule, .pName = "vertMain"};
    vk::PipelineShaderStageCreateInfo fragShaderStageInfo{.stage = vk::ShaderStageFlagBits::eFragment, .module = shaderModule, .pName = "fragMain"};
    vk::PipelineShaderStageCreateInfo shaderStages[] = {vertShaderStageInfo, fragShaderStageInfo};
}

[[nodiscard]] vk::raii::ShaderModule createShaderModule(const std::vector<char> &code) const
{
    vk::ShaderModuleCreateInfo createInfo{.codeSize = code.size() * sizeof(char), .pCode = reinterpret_cast<const uint32_t *>(code.data())};
    vk::raii::ShaderModule     shaderModule{device, createInfo};

    return shaderModule;
}`

const vertexinput = `vk::PipelineVertexInputStateCreateInfo vertexInputInfo;`
const assembly = `vk::PipelineInputAssemblyStateCreateInfo inputAssembly{  .topology = vk::PrimitiveTopology::eTriangleList };`
const viewport1 = `vk::Viewport{ 0.0f, 0.0f, static_cast<float>(swapChainExtent.width), static_cast<float>(swapChainExtent.height), 0.0f, 1.0f };`
const viewport2 = `vk::PipelineViewportStateCreateInfo      viewportState{.viewportCount = 1, .scissorCount = 1};
std::vector dynamicStates = {
    vk::DynamicState::eViewport,
    vk::DynamicState::eScissor
};
vk::PipelineDynamicStateCreateInfo dynamicState({}, dynamicStates.size(), dynamicStates.data());`
const multisampling = `vk::PipelineMultisampleStateCreateInfo multisampling{.rasterizationSamples = vk::SampleCountFlagBits::e1, .sampleShadingEnable = vk::False};`

const rasterizer = `vk::PipelineRasterizationStateCreateInfo rasterizer{.depthClampEnable = vk::False, .rasterizerDiscardEnable = vk::False, .polygonMode = vk::PolygonMode::eFill, .cullMode = vk::CullModeFlagBits::eBack, .frontFace = vk::FrontFace::eClockwise, .depthBiasEnable = vk::False, .depthBiasSlopeFactor = 1.0f, .lineWidth = 1.0f};`

const blend = `vk::PipelineColorBlendAttachmentState colorBlendAttachment{.blendEnable = vk::False, .colorWriteMask = vk::ColorComponentFlagBits::eR | vk::ColorComponentFlagBits::eG | vk::ColorComponentFlagBits::eB | vk::ColorComponentFlagBits::eA};

vk::PipelineColorBlendStateCreateInfo colorBlending{.logicOpEnable = vk::False, .logicOp = vk::LogicOp::eCopy, .attachmentCount = 1, .pAttachments = &colorBlendAttachment};`

const layout = `pipelineLayout = vk::raii::PipelineLayout(device, pipelineLayoutInfo);

vk::StructureChain<vk::GraphicsPipelineCreateInfo, vk::PipelineRenderingCreateInfo> pipelineCreateInfoChain = {
    {.stageCount          = 2,
        .pStages             = shaderStages,
        .pVertexInputState   = &vertexInputInfo,
        .pInputAssemblyState = &inputAssembly,
        .pViewportState      = &viewportState,
        .pRasterizationState = &rasterizer,
        .pMultisampleState   = &multisampling,
        .pColorBlendState    = &colorBlending,
        .pDynamicState       = &dynamicState,
        .layout              = pipelineLayout,
        .renderPass          = nullptr},
    {.colorAttachmentCount = 1, .pColorAttachmentFormats = &swapChainSurfaceFormat.format}};`

const create = `graphicsPipeline = vk::raii::Pipeline(device, nullptr, pipelineCreateInfoChain.get<vk::GraphicsPipelineCreateInfo>());`

return <div>
        <p>Now that we got a good chunk of Vulkan chores done, we can start working on the <a href='https://en.wikipedia.org/wiki/Graphics_pipeline'>graphics pipeline</a>.</p>

        We will start by setting up some shaders, which we write in slang. In Vulkan, shaders have to be spcified in bytecode. We can utilize Vulkan provided compilers to turn our shader code into this format.
        Starting with this simple hardcoded shader in slang: <Code>{shader}</Code>

        which we then compile into our <CodeFunc>slang.spv</CodeFunc>.

        <p>We then create a reader for our shader:</p>

        <Code>{read}</Code>

        Now we can create our shader module in our pipeline.

        <Code>{pipeline}</Code>

        Older APIs provided default states for most stages of the graphics pipeline. However in Vulkan, we have to be more explicit. 
        While most pipeline states are baked and fixed, there are "dynamic states" that can be changed without recreating the pipeline. 
        We will use the dynamic states of viewport and scissor state.

        We now go through all the stages of the pipeline and their states.

        <p>We first create a vertex input object that points to the vertex data. Since we are  using hardcoded data, we fill it with no vertex data.</p>
        <Code>{vertexinput}</Code>
        <p>We also need to specify how they are assembled, for example: lists for triangles, or strips of triangles.</p>
        <Code>{assembly}</Code>
        <p>Need to specify the viewport. Usually, we describe it using </p>
        <Code>{viewport1}</Code>
        However, since our viewport is dynamic, we just need to specify them during creation and enable it in the pipeline's dyanmic states.
        <Code>{viewport2}</Code>
        <p>Next is the rasterizer stage where we fill parameters for depth clamps, discards, how fragments are generated, line widths, culling, front faces, and depth biases.</p>
        <Code>{rasterizer}</Code>

        <p>We then have multisampling, which is useful for antialiasing, but is expensive and requires a GPU feature so we will leave it disabled.</p>
        <Code>{multisampling}</Code>
        <p>We also aren't using depth or stencils so we leave this stage empty as <CodeFunc>nullptr</CodeFunc>.</p>

        <p>Colors returned by our shaders also need to be combined with colors already in the frame buffer, and need to be blended in the next stage. Here we have two structs.
            The first struct contains the configuration for each framebuffer, and the second has the global color blending settings. Blending is commonly used in alphas and transparency, but we will leave it disabled as well.
        </p>
        <Code>{blend}</Code>

        <p>Finally we have the pipeline layout where we also specify our <CodeFunc>uniform</CodeFunc> shader values such as transformation matrices, as well as the actual layout of each stage of our pipeline.</p>
        <Code>{layout}</Code>
        <p>Usually, we would now need to specify render passes that included framebuffer attachments. However, since we are using dynamic rendering, we specify this information when recording the command buffers.
            and therefore leave the renderPass as <CodeFunc>nullptr</CodeFunc>.
        </p>

        And now create!
        <Code>{create}</Code>

    </div>
}