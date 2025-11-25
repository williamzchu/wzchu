import Code from "../../Code";
import CodeFunc from "../../CodeFunc";

export default function Descriptors() {
    return <div>
        <p>Although we can now pass vertices, we also need to pass global variables such as the model-view-projection matrix.
            Here, we descriptors, or resource that shaders can access. 

            For the case of transformation matrices, we will use uniform buffer objects. 
        </p>

        <p>We first update the shader to include the uniform buffer object:</p>

<Code>{
`struct VSInput {
    float2 inPosition;
    float3 inColor;
};

struct UniformBuffer {
    float4x4 model;
    float4x4 view;
    float4x4 proj;
};
ConstantBuffer<UniformBuffer> ubo;

struct VSOutput
{
    float4 pos : SV_Position;
    float3 color;
};

[shader("vertex")]
VSOutput vertMain(VSInput input) {
    VSOutput output;
    output.pos = mul(ubo.proj, mul(ubo.view, mul(ubo.model, float4(input.inPosition, 0.0, 1.0))));
    output.color = input.inColor;
    return output;
}`}</Code>

and our actual buffer object:

<Code>{
`struct UniformBufferObject {
    glm::mat4 model;
    glm::mat4 view;
    glm::mat4 proj;
};`}</Code>

<p>We then setup the descriptor set layout, which specifies the types of resources that are going to be accessed by the pipeline. The descriptor set specifies the actual buffer or resources that will be bound.

    To setup the layout, we specify the binding used, which for us is a uniform buffer, and it's count along with which shader stage it will be used in.
</p>

<Code>{
`vk::raii::DescriptorSetLayout descriptorSetLayout = nullptr;

void createDescriptorSetLayout() {
    vk::DescriptorSetLayoutBinding    uboLayoutBinding(0, vk::DescriptorType::eUniformBuffer, 1, vk::ShaderStageFlagBits::eVertex, nullptr);
    vk::DescriptorSetLayoutCreateInfo layoutInfo{.bindingCount = 1, .pBindings = &uboLayoutBinding};
    descriptorSetLayout = vk::raii::DescriptorSetLayout(device, layoutInfo);
}`}</Code>

and also updating our pipeline to include our descriptor:

<Code>{`vk::PipelineLayoutCreateInfo pipelineLayoutInfo{ .setLayoutCount = 1, .pSetLayouts = &*descriptorSetLayout, .pushConstantRangeCount = 0 };`}</Code>

Now to create our uniform buffers, we need to keep in mind that data is going to be copied to the buffer every frame. Therefore, we don't use staging buffers.
Instead, we will have multiple buffers for each frame as we don't as frames may be in flight at the same time and we don't want ot update the buffers while other frames are reading from it, and write to uniform buffers that are not being read by the GPU.

<Code>{
`std::vector<vk::raii::Buffer> uniformBuffers;
std::vector<vk::raii::DeviceMemory> uniformBuffersMemory;
std::vector<void*> uniformBuffersMapped;

void createUniformBuffers() {
    uniformBuffers.clear();
    uniformBuffersMemory.clear();
    uniformBuffersMapped.clear();

    for (size_t i = 0; i < MAX_FRAMES_IN_FLIGHT; i++) {
        vk::DeviceSize bufferSize = sizeof(UniformBufferObject);
        vk::raii::Buffer buffer({});
        vk::raii::DeviceMemory bufferMem({});
        createBuffer(bufferSize, vk::BufferUsageFlagBits::eUniformBuffer, vk::MemoryPropertyFlagBits::eHostVisible | vk::MemoryPropertyFlagBits::eHostCoherent, buffer, bufferMem);
        uniformBuffers.emplace_back(std::move(buffer));
        uniformBuffersMemory.emplace_back(std::move(bufferMem));
        uniformBuffersMapped.emplace_back( uniformBuffersMemory[i].mapMemory(0, bufferSize));
    }
}`}</Code>

Here, we also map the memory right after creation, so we won't need to map it every time we need it. This is know as "persistent mapping."

<p>Now we also need to update the uniform's data. We do this in our <CodeFunc>drawFrame</CodeFunc> before our submit.</p>

<Code>{
`void updateUniformBuffer(uint32_t currentImage) {
    static auto startTime = std::chrono::high_resolution_clock::now();

    auto currentTime = std::chrono::high_resolution_clock::now();
    float time = std::chrono::duration<float, std::chrono::seconds::period>(currentTime - startTime).count();

    UniformBufferObject ubo{};
    ubo.model = rotate(glm::mat4(1.0f), time * glm::radians(90.0f), glm::vec3(0.0f, 0.0f, 1.0f));
    ubo.view = lookAt(glm::vec3(2.0f, 2.0f, 2.0f), glm::vec3(0.0f, 0.0f, 0.0f), glm::vec3(0.0f, 0.0f, 1.0f));
    ubo.proj = glm::perspective(glm::radians(45.0f), static_cast<float>(swapChainExtent.width) / static_cast<float>(swapChainExtent.height), 0.1f, 10.0f);
    ubo.proj[1][1] *= -1; // Since GLM was designed for OpenGL, Y coordinate of clip coordinate inverted

    memcpy(uniformBuffersMapped[currentImage], &ubo, sizeof(ubo));
}`}</Code>

Here we create a rotation about the Z-axis to turn with time.


<p>Now that we created the descriptor set layout, we still need to create the descriptor set for each buffer resource and bind it to our uniform buffer descriptor.</p>

<p>However, we can't create descriptor sets directly, and they must be allocated from a pool like command buffers. Here, we use what is called descriptor pool.</p>

<Code>{
`void createDescriptorPool() {
    vk::DescriptorPoolSize poolSize(vk::DescriptorType::eUniformBuffer, MAX_FRAMES_IN_FLIGHT);
    vk::DescriptorPoolCreateInfo poolInfo{ .flags = vk::DescriptorPoolCreateFlagBits::eFreeDescriptorSet, .maxSets = MAX_FRAMES_IN_FLIGHT, .poolSizeCount = 1, .pPoolSizes = &poolSize };
    descriptorPool = vk::raii::DescriptorPool(device, poolInfo);
}`}</Code>

and then create the descriptor sets themselves:

<Code>{
`void createDescriptorSets() {
    std::vector<vk::DescriptorSetLayout> layouts(MAX_FRAMES_IN_FLIGHT, *descriptorSetLayout);
    vk::DescriptorSetAllocateInfo allocInfo{ .descriptorPool = descriptorPool, .descriptorSetCount = static_cast<uint32_t>(layouts.size()), .pSetLayouts = layouts.data() };

    descriptorSets.clear();
    descriptorSets = device.allocateDescriptorSets(allocInfo);

    // Still need to configure each descriptor within the sets
    for (size_t i = 0; i < MAX_FRAMES_IN_FLIGHT; i++) {
        vk::DescriptorBufferInfo bufferInfo{ .buffer = uniformBuffers[i], .offset = 0, .range = sizeof(UniformBufferObject) };
        vk::WriteDescriptorSet descriptorWrite{ .dstSet = descriptorSets[i], .dstBinding = 0, .dstArrayElement = 0, .descriptorCount = 1, .descriptorType = vk::DescriptorType::eUniformBuffer, .pBufferInfo = &bufferInfo };
        device.updateDescriptorSets(descriptorWrite, {});
    }
}`}</Code>

Now to use the descriptor set, we update our <CodeFunc>recordCommandBuffer</CodeFunc> to bind the descriptor set.

<Code>{`commandBuffers[currentFrame].bindDescriptorSets(vk::PipelineBindPoint::eGraphics, pipelineLayout, 0, *descriptorSets[currentFrame], nullptr);
commandBuffers[currentFrame].drawIndexed(indices.size(), 1, 0, 0, 0);`}</Code>

Now one more little thing, since we flipped the y-axis, all the vertices are now drawn in counter-clockwise order, which causes backface culling to prevent the triangles from being drawn. 
One fix is to correct this in the rasterizer:

<Code>{`vk::PipelineRasterizationStateCreateInfo rasterizer({}, vk::False, vk::False, vk::PolygonMode::eFill,
vk::CullModeFlagBits::eBack, vk::FrontFace::eCounterClockwise, vk::False, 0.0f, 0.0f, 1.0f, 1.0f);`}</Code>
</div>
}